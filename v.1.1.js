


$(async function () {
    $('.dashboard--graph').hide()


    const fillTable = (data) => {
        let adminFeePercent = data.admin_fees_percentage_of_premium;
        let premiumGrowthPercent = data.annual_premium_percentage_yoy_growth_rate;
        let investmentIncomePercent = data.investment_income_percentage_of_net_income;
        let lossAdjustmentPercent = data.loss_adjustment_percentage;
        let opexPercent = data.opex_percentage_of_premium;
        let reinsurancePercent = data.reinsurance_percentage_of_premium;

        data.rows.forEach((element, index) => {
            $('.dashboard--graph--table--values').eq(0).find('.graph--table--value').eq(index).text('$' + Math.round(element.cumulative_surplus).toLocaleString())
            $('.dashboard--graph--table--values').eq(1).find('.graph--table--value').eq(index).text('$' + (Math.round(element.surplus_and_investment_income) - Math.round(element.investment_income)).toLocaleString())
            $('.dashboard--graph--table--values').eq(2).find('.graph--table--value').eq(index).text('$' + Math.round(element.investment_income).toLocaleString())
            $('.dashboard--graph--table--values').eq(3).find('.graph--table--value').eq(index).text('$' + Math.round(element.annual_premium).toLocaleString())
            $('.dashboard--graph--table--values').eq(4).find('.graph--table--value').eq(index).text('$' + Math.round(element.estimated_losses).toLocaleString())
            $('.dashboard--graph--table--values').eq(5).find('.graph--table--value').eq(index).text('$' + (Math.round(element.estimated_losses * 0.05)).toLocaleString())
            $('.dashboard--graph--table--values').eq(6).find('.graph--table--value').eq(index).text('$' + Math.round(element.reinsurance).toLocaleString())
            $('.dashboard--graph--table--values').eq(7).find('.graph--table--value').eq(index).text('$' + Math.round(element.operational_expenses).toLocaleString())
            $('.dashboard--graph--table--values').eq(8).find('.graph--table--value').eq(index).text('$' + Math.round(element.admin_fees).toLocaleString())
        })
    }

    const getModel = async (estimatedClaims = null, annualPremium = null) => {

        const auth0Client = await auth0.createAuth0Client({
            domain: "login.xn.capital",
            clientId: "NoSXDnJTyhvN9uXGuAbqkCXeEdf15DzV",
            authorizationParams: {
                audience: "https://server.xn.capital"
            },
        });
        const token = await auth0Client.getTokenSilently();
        $.ajax({
            url: 'https://server.xn.capital/api/users/update-model',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            contentType: 'application/json',
            data: JSON.stringify({
                estimatedClaims: estimatedClaims, // 
                annualPremium: annualPremium
            }),
            success: function (response) {
                $('.dashboard--graph--block').css('height', '0px')
                const firstSixModels = response.responseData.model.rows.slice(0, 6);
                console.log(response.responseData.model); // Optionally log the first 6 models
                //window.location.hash = '#graph';
                $('#annual_premium_increase').text(Number(response.responseData.model.annual_premium_percentage_yoy_growth_rate) * 100 + '%')
                $('#cost_of_reinsurance').text(Number(response.responseData.model.reinsurance_percentage_of_premium) * 100 + '%')
                $('#operational_fees_and_expenses').text((Number(response.responseData.model.opex_percentage_of_premium) * 100) + (Number(response.responseData.model.admin_fees_percentage_of_premium) * 100) + '%')
                $('.dashboard--graph--cta').hide()
                $('.dashboard--graph').show()
                $('.dhome--assumptions-form').css('display', 'flex')
                $('.dashboard--sub-horizontal--wrapper').css('display', 'flex')
                $('.graph--table--form--block').css('display', 'block')

                initiateGraph(firstSixModels);
                if (!($('#surplus_and_investment_income').hasClass('active'))) $('#surplus_and_investment_income').trigger('click')
                fillTable(response.responseData.model)
                setTimeout(() => {
                    sortBlocks();
                    $('.dashboard--graph--mask').css('display', 'none')

                }, 2000);





            },
            error: function (xhr, status, error) {
                console.error('get model failed:', xhr.responseText);
                $('#tab--home').remove()
                $('.dashboard--graph--cta').css('display', 'flex')
                $('.dashboard--graph--wrapper').hide()

            }
        });

    };


    const sortBlocks = () => {
        $('.dashboard--graph--column').each((i, el) => {
            let blocksArray = [];
            let blocks = $(el).find('.dashboard--graph--block');
            blocks.each((index, element) => {
                const heightString = $(element).css('height'); // Get the height as a string (e.g., "999px")
                const heightValue = parseFloat(heightString); // Convert to a numeric value (e.g., 999)
                blocksArray.push({
                    element: $(element),
                    value: heightValue
                });
                console.log($(element).css('height'))
            });

            // Sort blocksArray by height in descending order (highest to lowest)
            blocksArray.sort((a, b) => b.value - a.value);
            console.log(blocksArray)
            // Assign z-index values based on the sorted order
            blocksArray.forEach((block, index) => {
                block.element.css('z-index', index + 1);
            });
        });
    };




    const initiateGraph = async (data) => {



        const getMaxValue = (data) => {
            let maxValues;
            maxValues = data.map(element => {
                let annual_premium = element.annual_premium;
                let reinsurance = element.reinsurance
                let estimated_losses = element.estimated_losses
                let admin_fees_and_operational_expenses = element.admin_fees_and_operational_expenses
                let surplus_and_investment_income = element.surplus_and_investment_income
                return Math.max(annual_premium, reinsurance, estimated_losses, admin_fees_and_operational_expenses, surplus_and_investment_income);
            });
            return Math.max(...maxValues);
        };

        const highestValue = getMaxValue(data);

        function roundUpToFirstDigit(number) {
            var length = Math.ceil(Math.log10(number + 1));
            var multiplier = Math.pow(10, length - 1);

            return Math.ceil(number / multiplier) * multiplier;
        }

        function formatValue(value) {
            // If value is less than 1 million, format it as 'K'
            if (Math.abs(value) < 1) {
                // Convert to thousands and keep two decimal places
                return (Math.abs(value) * 1000) + 'K';
            } else {
                // Keep the existing formatting for millions
                return Math.abs(value) + 'M';
            }
        }

        var resultTop = roundUpToFirstDigit(highestValue);
        var baseValueTop = (resultTop / 1000000).toFixed(1);
        var twoThirdsValueTop = ((baseValueTop / 3) * 2).toFixed(1);
        var oneThirdValueTop = (baseValueTop / 3).toFixed(1);

        $('.dashboard--graph--label').eq(0).text('$' + formatValue(baseValueTop));
        $('.dashboard--graph--label').eq(1).text('$' + formatValue(twoThirdsValueTop));
        $('.dashboard--graph--label').eq(2).text('$' + formatValue(oneThirdValueTop));

        function calculateYPixels(xValue, yValue, xPixels) {
            var proportion = yValue / xValue;
            var yPixels = proportion * xPixels;
            return yPixels;
        }



        $('.dashboard--graph--block').removeClass('annual_premium')
        $('.dashboard--graph--block').removeClass('estimated_losses')
        $('.dashboard--graph--block').removeClass('admin_fees_and_operational_expenses')
        $('.dashboard--graph--block').removeClass('reinsurance')
        $('.dashboard--graph--block').removeClass('surplus_and_investment_income')
        //$('.dashboard--graph--block').css('height', `0px`)


        data.forEach((element, index) => {
            if (index === 6) return;
            let values = []
            let annual_premium = Math.round(element.annual_premium);
            let reinsurance = Math.round(element.reinsurance);
            let admin_fees_and_operational_expenses = Math.round(element.admin_fees_and_operational_expenses);
            let estimated_losses = Math.round(element.estimated_losses);
            let surplus_and_investment_income = Math.round(element.surplus_and_investment_income);
            let cumulative_surplus = (element.cumulative_surplus / 1000000).toFixed(2)
            $('.surplus--text').eq(index).text(`$${formatValue(cumulative_surplus)}`)

            values = [
                {
                    name: `annual_premium`,
                    value: annual_premium
                },
                {
                    name: `estimated_losses`,
                    value: estimated_losses
                },

                {
                    name: `reinsurance`,
                    value: reinsurance
                },

                {
                    name: `admin_fees_and_operational_expenses`,
                    value: admin_fees_and_operational_expenses
                },
                {
                    name: `surplus_and_investment_income`,
                    value: surplus_and_investment_income
                }
            ]
            valuesAbs = [
                {
                    name: `annual_premium`,
                    value: Math.abs(annual_premium)
                },
                {
                    name: `estimated_losses`,
                    value: Math.abs(estimated_losses)
                },

                {
                    name: `reinsurance`,
                    value: Math.abs(reinsurance)
                },

                {
                    name: `admin_fees_and_operational_expenses`,
                    value: Math.abs(admin_fees_and_operational_expenses)
                },
                {
                    name: `surplus_and_investment_income`,
                    value: Math.abs(surplus_and_investment_income)
                }
            ]

            //console.log(values[2].value / values[0].value)
            //$('#cost_of_reinsurance').text()

            //setZIndexBasedOnValue(valuesAbs, index);


            $('.dashboard--graph--year').eq(index).text(`${2023 + element.year}`)

            values.forEach((el, i) => {
                let elHeight = Math.abs(el.value)

                elHeight = calculateYPixels(resultTop, elHeight, 500);

                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).removeClass(`negative`)
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeight}`)




                if (!($('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).hasClass(`${el.name}`))) $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).addClass(`${el.name}`)
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).text('$' + el.value.toLocaleString());

            })



        })

        $('.dgraph--index--text').each(function () {
            $(this).data('clicked', false);
        });



    }

    $('.dgraph--index--text').on('click', function () {
        let $this = $(this);
        let id = $this.attr('id');
        $this.data('clicked', !$this.data('clicked'));
        if ($this.data('clicked')) {
            $this.addClass('active');
            activateGraph(id);
            let bgColor = $(`.${$this.attr('id')}`).css('background-color');
            $this.css('background-color', `${bgColor}`)
            $this.siblings('.dgraph--index--circle').css('background-color', `${bgColor}`)

            if ($this.attr('id') === 'reinsurance') $('#reinsurance').css('color', '#fff')
            if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#fff')
            if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#fff')

        } else {
            $this.removeClass('active');
            deactivateGraph(id);
            $this.css('background-color', `#f0f1f3`)
            $this.siblings('.dgraph--index--circle').css('background-color', `#656f7d`)
            if ($this.attr('id') === 'reinsurance') $('#reinsurance').css('color', '#203a46')
            if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#203a46')
            if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#203a46')
        }
    });



    $('.dgraph--index--text').hover(
        function () {
            let $this = $(this);
            if (!$this.data('clicked')) {
                $this.addClass('active');
                activateGraph($this.attr('id'));
                let bgColor = $(`.${$this.attr('id')}`).css('background-color');
                $this.css('background-color', `${bgColor}`)
                $this.siblings('.dgraph--index--circle').css('background-color', `${bgColor}`)
                if ($this.attr('id') === 'reinsurance') $('#reinsurance').css('color', '#fff')
                if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#fff')
                if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#fff')

            }
        },
        function () { // Mouse leave
            let $this = $(this);
            // Only reset styles if the element has not been clicked
            if (!$this.data('clicked')) {
                $this.removeClass('active');
                deactivateGraph($this.attr('id'));
                $this.css('background-color', `#f0f1f3`)
                $this.siblings('.dgraph--index--circle').css('background-color', `#656f7d`)
                if ($this.attr('id') === 'reinsurance') $('#reinsurance').css('color', '#203a46')
                if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#203a46')
                if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#203a46')
            }
        }

    );

    function activateGraph(id) {
        $(`.${id}`).find('.dashboard--graph--point').css('display', 'flex');


        /* 
        if ($(`.${id}`).hasClass('negative')) {
            $(`.${id}`).css('background-color', 'rgba(89, 141, 166, 0.55)');
        } else {
            $(`.${id}`).css('background-color', 'rgba(121, 102, 204, 0.55)');
        } */
    }

    function deactivateGraph(id) {

        $(`.${id}`).find('.dashboard--graph--point').css('display', 'none');

        /* 
        if ($(`.${id}`).hasClass('negative')) {
            $(`.${id}`).css('background-color', 'rgba(89, 141, 166, 0.25)');
        } else {
            $(`.${id}`).css('background-color', 'rgba(121, 102, 204, 0.25)');
        } */
    }


    //$('#annual_premium').trigger('click')



    function formatDollarInput($input) {
        $input.on('input', function () {
            var cursorPos = this.selectionStart;
            var value = $(this).val().replace(/[^0-9.]/g, '');
            var beforeCursor = $(this).val().substr(0, cursorPos);
            var nonNumericBeforeCursor = beforeCursor.replace(/[0-9.]/g, '').length;
            if (value) {
                var formattedValue = parseFloat(value).toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0,
                    useGrouping: true
                });
                $(this).val('$' + formattedValue);
            } else {
                $(this).val('$');
            }
            var afterCursor = $(this).val().substr(0, cursorPos + 1);
            var nonNumericAfterCursor = afterCursor.replace(/[0-9.]/g, '').length;
            cursorPos += (nonNumericAfterCursor - nonNumericBeforeCursor);
            this.setSelectionRange(cursorPos, cursorPos);
        });
    }


    $('.assumption--input--button').on('click', () => {
        let annualPremiumText = $('#heading--premium').text()
        let totalClaimsText = $('#heading--claims').text()
        let annualPremium = $('#assumption--input--premium').val()
        let estimatedClaims = $('#assumption--input--claims').val()
        console.log('annualPremium', annualPremium)
        console.log('estimatedClaims', estimatedClaims)

        if (!estimatedClaims) {
            estimatedClaims = null
            console.log(`estimatedClaims === $0`)
            $('#heading--claims').text(totalClaimsText)
        } else {
            $('#heading--claims').text(estimatedClaims)
        }
        if (!annualPremium) {
            console.log(`annualPremium === $0`)
            annualPremium = null
            $('#heading--premium').text(annualPremiumText)
        } else {
            $('#heading--premium').text(annualPremium)
        }
        getModel(estimatedClaims, annualPremium)
        $('.dashboard--graph--mask').css('display', 'flex')
    })

    $('.dollar').each(function () {
        formatDollarInput($(this));
    });

    getModel();


});
