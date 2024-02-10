


$(async function () {
    $('.dashboard--graph').hide()



    const assumptionInfo = () => {
        //annual premium growth rate
        //reinsurance/premium*100
        //admin-ops/premium
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
                const firstSixModels = response.responseData.model.slice(0, 6);
                console.log(firstSixModels); // Optionally log the first 6 models
                window.location.hash = '#graph';
                $('.dashboard--graph--cta').hide()
                $('.dashboard--graph').show()
                initiateGraph(firstSixModels);
                $('#surplus_and_investment_income').trigger('click')




            },
            error: function (xhr, status, error) {
                console.error('get model failed:', xhr.responseText);
                $('#tab--home').remove()
                $('.dashboard--graph--cta').css('display', 'flex')
                $('.dashboard--graph--wrapper').hide()

            }
        });

    };


    const initiateGraph = async (data) => {



        const getMaxValue = (data, whichSide) => {
            let maxValues;
            if (whichSide === 'top') {
                console.log('here', data)
                maxValues = data.map(element => element.surplus_and_investment_income);

            } else if (whichSide === 'bottom') {
                maxValues = data.map(element => {
                    let annual_premium = element.annual_premium;
                    let reinsurance = element.reinsurance
                    let estimated_losses = element.estimated_losses
                    let admin_fees_and_operational_expenses = element.admin_fees_and_operational_expenses
                    return Math.max(annual_premium, reinsurance, estimated_losses, admin_fees_and_operational_expenses);
                });
            }
            return Math.max(...maxValues);
        };

        const highestValueTop = getMaxValue(data, 'top');
        const highestValueBottom = getMaxValue(data, 'bottom');

        function roundUpToFirstDigit(number) {
            var length = Math.ceil(Math.log10(number + 1));
            var multiplier = Math.pow(10, length - 1);

            return Math.ceil(number / multiplier) * multiplier;
        }

        function formatValue(value) {
            // If value is less than 1 million, format it as 'K'
            if (value < 1) {
                // Convert to thousands and keep two decimal places
                return '$' + (value * 1000) + 'K';
            } else {
                // Keep the existing formatting for millions
                return '$' + value + 'M';
            }
        }

        var resultTop = roundUpToFirstDigit(highestValueTop);
        var baseValueTop = (resultTop / 1000000).toFixed(1);
        var twoThirdsValueTop = ((baseValueTop / 3) * 2).toFixed(1);
        var oneThirdValueTop = (baseValueTop / 3).toFixed(1);

        var resultBottom = roundUpToFirstDigit(highestValueBottom);
        var baseValueBottom = (resultBottom / 1000000).toFixed(1);
        var twoThirdsValueBottom = ((baseValueBottom / 3) * 2).toFixed(1);
        var oneThirdValueBottom = (baseValueBottom / 3).toFixed(1);

        $('.dashboard--graph--label').eq(0).text(formatValue(baseValueTop));
        $('.dashboard--graph--label').eq(1).text(formatValue(twoThirdsValueTop));
        $('.dashboard--graph--label').eq(2).text(formatValue(oneThirdValueTop));
        // Bottom
        $('.dashboard--graph--label').eq(4).text(formatValue(-oneThirdValueBottom));
        $('.dashboard--graph--label').eq(5).text(formatValue(-twoThirdsValueBottom));
        $('.dashboard--graph--label').eq(6).text(formatValue(-baseValueBottom));


        function calculateYPixels(xValue, yValue, xPixels) {
            var proportion = yValue / xValue;
            var yPixels = proportion * xPixels;
            return yPixels;
        }


        function setZIndexBasedOnValue(values, index) {
            // Sort the array by the value property, in ascending order
            const sortedValues = values.sort((a, b) => a.value - b.value);

            // Loop through the sorted array
            sortedValues.forEach((item, i) => {
                // Set the z-i of each element based on its position in the sorted array
                // Use the name as a class selector to target the correct elements
                $('.dashboard--graph--column').find(`.${item.name}`).css('z-index', index);
            });
        }

        data.forEach((element, index) => {
            if (index === 6) return;
            let values = []
            let annual_premium = -Math.round(element.annual_premium);
            let reinsurance = -Math.round(element.reinsurance);
            let admin_fees_and_operational_expenses = -Math.round(element.admin_fees_and_operational_expenses);
            let estimated_losses = -Math.round(element.estimated_losses);
            let surplus_and_investment_income = Math.round(element.surplus_and_investment_income);
            let cumulative_surplus = (element.cumulative_surplus / 1000000).toFixed(2)
            $('.surplus--text').eq(index).text(`${formatValue(cumulative_surplus)}`)

            values = [
                {
                    name: `annual_premium`,
                    value: annual_premium
                },
                {
                    name: `admin_fees_and_operational_expenses`,
                    value: admin_fees_and_operational_expenses
                },
                {
                    name: `reinsurance`,
                    value: reinsurance
                },
                {
                    name: `estimated_losses`,
                    value: estimated_losses
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
                    name: `admin_fees_and_operational_expenses`,
                    value: Math.abs(admin_fees_and_operational_expenses)
                },
                {
                    name: `reinsurance`,
                    value: Math.abs(reinsurance)
                },
                {
                    name: `estimated_losses`,
                    value: Math.abs(estimated_losses)
                },
                {
                    name: `surplus_and_investment_income`,
                    value: Math.abs(surplus_and_investment_income)
                }
            ]

            //console.log(values[2].value / values[0].value)
            //$('#cost_of_reinsurance').text()

            setZIndexBasedOnValue(values, index);


            $('.dashboard--graph--year').eq(index).text(`${2023 + element.year}`)

            values.forEach((el, i) => {
                let elHeight = Math.abs(el.value)

                elHeightTop = calculateYPixels(resultTop, elHeight, 300);
                elHeightBottom = calculateYPixels(resultBottom, elHeight, 300);

                
                if (el.value > 0) {

                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeightTop}`)
                } else {
                    if(i === 4){
                        $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeightTop}`)
                        return
                    }
                    
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).addClass(`negative`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeightBottom}`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('top', `auto`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('bottom', `-5px`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('background-color', `rgba(48, 87, 105, 1)`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('outline', `8px solid rgba(48, 87, 105, 0.15)`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).css('background-color', `#E0E6E9`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).css('color', `#305769`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--label').eq(i).css('top', `330%`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--label').eq(i).css('bottom', `auto`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--deco').eq(i).css('top', `-6px`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--deco').eq(i).css('background-color', `#E0E6E9`)
                }
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).addClass(`${el.name}`)
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).text('$' + el.value.toLocaleString());
                if(i === 4){
                    console.log(el.value)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).removeClass(`negative`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeightTop}`)
                }
            })



        })

        $('.dgraph--index--text').each(function () {
            $(this).data('clicked', false);
        });


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

                if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#fff')
                if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#fff')

            } else {
                $this.removeClass('active');
                deactivateGraph(id);
                $this.css('background-color', `#f0f1f3`)
                $this.siblings('.dgraph--index--circle').css('background-color', `#656f7d`)
                if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#203a46')
                if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#203a46')
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
                    if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#fff')
                    if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#fff')

                }
            },
            function () { // Mouse leave
                let $this = $(this);
                if (!$this.data('clicked')) {
                    $this.removeClass('active');
                    deactivateGraph($this.attr('id'));
                    $this.css('background-color', `#f0f1f3`)
                    $this.siblings('.dgraph--index--circle').css('background-color', `#656f7d`)
                    if ($this.attr('id') === 'admin_fees_and_operational_expenses') $('#admin_fees_and_operational_expenses').css('color', '#203a46')
                    if ($this.attr('id') === 'surplus_and_investment_income') $('#surplus_and_investment_income').css('color', '#203a46')
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
        $('.dashboard--graph--mask').css('display', 'none')
    }

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
        let annualPremium = $('#assumption--input--premium').val()
        let estimatedClaims = $('#assumption--input--claims').val()
        $('#heading--claims').text(estimatedClaims)
        $('#heading--premium').text(annualPremium)
        if (estimatedClaims === `$0`) estimatedClaims = null
        if (annualPremium === `$0`) annualPremium = null
        console.log('estimatedClaims', estimatedClaims)
        console.log('annualPremium', annualPremium)
        getModel(estimatedClaims, annualPremium)
        $('.dashboard--graph--mask').css('display', 'flex')
    })

    $('.dollar').each(function () {
        formatDollarInput($(this));
    });

    getModel();


});
